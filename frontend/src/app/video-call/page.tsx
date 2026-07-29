"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import { 
    Video, VideoOff, Mic, MicOff, PhoneOff, 
    MessageSquare, FileText, Send, User, 
    Clock, Activity, ShieldAlert, Plus, Trash2, CheckCircle2 
} from "lucide-react";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";

interface PrescriptionInput {
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
}

export default function VideoCallPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const appointmentId = searchParams.get("appointmentId");

    // Refs
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);

    // Component State
    const [appointment, setAppointment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<"connecting" | "waiting" | "connected" | "disconnected">("connecting");
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    // Sidebar & Chat State
    const [activeTab, setActiveTab] = useState<"chat" | "medical">("chat");
    const [messages, setMessages] = useState<Array<{ sender: string; text: string; time: string }>>([]);
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Doctor Medical Record State
    const [diagnosis, setDiagnosis] = useState("");
    const [notes, setNotes] = useState("");
    const [prescriptions, setPrescriptions] = useState<PrescriptionInput[]>([]);
    const [submittingRecord, setSubmittingRecord] = useState(false);

    // Fetch appointment detail & verify accessibility
    useEffect(() => {
        if (!appointmentId) {
            setError("Mã lịch hẹn không hợp lệ.");
            setLoading(false);
            return;
        }

        async function getAppointmentDetails() {
            try {
                const res = await api.get(`/appointments/${appointmentId}`);
                const appData = res.data.appointment;
                setAppointment(appData);

                // If appointment is not CONFIRMED or COMPLETED, throw warning
                if (appData.status !== "CONFIRMED" && appData.status !== "COMPLETED") {
                    setError("Lịch hẹn này chưa được xác nhận hoặc đã bị hủy.");
                }
            } catch (err: any) {
                setError(err.message || "Không thể tải thông tin lịch hẹn.");
            } finally {
                setLoading(false);
            }
        }

        getAppointmentDetails();
    }, [appointmentId]);

    // Setup Socket & Media Streams
    useEffect(() => {
        const currentUser = user;
        if (!appointment || error || !currentUser) return;

        // Initialize local camera/mic & socket
        async function startMedia() {
            if (!currentUser) return;
            let stream: MediaStream | null = null;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: "user" },
                    audio: true
                });
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (mediaErr) {
                console.error("Error accessing camera/mic:", mediaErr);
                toast.error("Không thể kết nối camera/microphone. Bạn tham gia ở chế độ không có camera/micro.");
            }

            try {
                // Connect to Socket signaling server
                const backendUrl = process.env.NEXT_PUBLIC_API_URL 
                    ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "") 
                    : "http://localhost:5000";

                const socket = io(backendUrl, {
                    withCredentials: true,
                    transports: ["websocket", "polling"]
                });

                socketRef.current = socket;

                // Emit join-room
                socket.emit("join-room", {
                    appointmentId,
                    role: currentUser.role,
                    name: currentUser.fullName || currentUser.email,
                    avatar: currentUser.avatar
                });

                setConnectionStatus("waiting");

                // Listeners
                socket.on("user-connected", ({ role, name }) => {
                    setConnectionStatus("connected");
                    toast.success(`${name} (${role === "DOCTOR" ? "Bác sĩ" : "Bệnh nhân"}) đã tham gia phòng.`);
                    
                    // Emit a ready signal so the newly joined user knows we are here
                    socket.emit("signal", {
                        appointmentId,
                        signalData: { type: "ready" }
                    });

                    // If current user is the doctor, initiate peer connection
                    if (currentUser.role === "DOCTOR" && !peerConnectionRef.current) {
                        initiateCall(stream, socket);
                    }
                });

                socket.on("signal", async ({ signalData }) => {
                    const pc = peerConnectionRef.current;
                    
                    if (signalData.type === "ready") {
                        if (currentUser.role === "DOCTOR" && !peerConnectionRef.current) {
                            initiateCall(stream, socket);
                        }
                        return;
                    }

                    if (signalData.sdp) {
                        if (signalData.sdp.type === "offer") {
                            // Patient receives Offer
                            const peerConnection = createPeerConnection(stream, socket);
                            await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
                            
                            // Process any queued ICE candidates
                            while (iceCandidatesQueue.current.length > 0) {
                                const candidate = iceCandidatesQueue.current.shift();
                                if (candidate) await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                            }

                            const answer = await peerConnection.createAnswer();
                            await peerConnection.setLocalDescription(answer);
                            socket.emit("signal", {
                                appointmentId,
                                signalData: { sdp: peerConnection.localDescription }
                            });
                            setConnectionStatus("connected");
                        } else if (signalData.sdp.type === "answer") {
                            // Doctor receives Answer
                            if (pc) {
                                await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
                            }
                        }
                    } else if (signalData.candidate) {
                        if (pc && pc.remoteDescription) {
                            await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
                        } else {
                            // Queue candidate if remote description not set yet
                            iceCandidatesQueue.current.push(signalData.candidate);
                        }
                    }
                });

                socket.on("receive-message", (msg) => {
                    setMessages((prev) => [...prev, msg]);
                });

                socket.on("call-ended", () => {
                    setConnectionStatus("disconnected");
                    toast.error("Cuộc gọi đã kết thúc bởi đối phương.");
                    setTimeout(() => {
                        exitRoom();
                    }, 3000);
                });

                socket.on("user-disconnected", () => {
                    setConnectionStatus("waiting");
                    toast("Đối phương đã ngắt kết nối.", { icon: "⚠️" });
                    setRemoteStream(null);
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = null;
                    }
                });

                // We don't need the hello signal anymore since we handle it in user-connected

            } catch (socketErr) {
                console.error("Socket error:", socketErr);
                setError("Không thể kết nối đến máy chủ phòng khám.");
            }
        }

        startMedia();

        return () => {
            cleanupCall();
        };
    }, [appointment]);

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Create RTCPeerConnection
    const createPeerConnection = (stream: MediaStream | null, socket: Socket) => {
        if (peerConnectionRef.current) return peerConnectionRef.current;

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" }
            ]
        });

        peerConnectionRef.current = pc;

        // Add local tracks to peer connection
        if (stream) {
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });
        }

        // Set remote video stream
        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            }
        };

        // Emit local ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("signal", {
                    appointmentId,
                    signalData: { candidate: event.candidate }
                });
            }
        };

        return pc;
    };

    // Doctor initiates offer
    const initiateCall = async (stream: MediaStream | null, socket: Socket) => {
        try {
            const pc = createPeerConnection(stream, socket);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("signal", {
                appointmentId,
                signalData: { sdp: pc.localDescription }
            });
        } catch (err) {
            console.error("Error creating WebRTC offer:", err);
        }
    };

    // Toggle camera/mic
    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    // Send chat message
    const sendChatMessage = () => {
        if (!chatInput.trim() || !socketRef.current) return;
        const msg = {
            sender: user?.fullName || "Tôi",
            text: chatInput.trim(),
            time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        };
        socketRef.current.emit("send-message", { appointmentId, message: msg });
        setMessages((prev) => [...prev, msg]);
        setChatInput("");
    };

    // End call manually
    const handleEndCall = () => {
        if (socketRef.current) {
            socketRef.current.emit("end-call", { appointmentId });
        }
        cleanupCall();
        toast.success("Đã rời phòng khám.");
        exitRoom();
    };

    const exitRoom = () => {
        if (user?.role === "DOCTOR") {
            router.push("/doctor/appointments");
        } else {
            router.push("/my-appointments");
        }
    };

    const cleanupCall = () => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
    };

    // Doctor medical record handlers
    const addPrescriptionRow = () => {
        setPrescriptions((prev) => [
            ...prev,
            { medicationName: "", dosage: "", frequency: "", duration: "" }
        ]);
    };

    const removePrescriptionRow = (idx: number) => {
        setPrescriptions((prev) => prev.filter((_, i) => i !== idx));
    };

    const updatePrescriptionField = (idx: number, field: keyof PrescriptionInput, value: string) => {
        setPrescriptions((prev) =>
            prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
        );
    };

    const handleSaveMedicalRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!diagnosis.trim()) {
            toast.error("Vui lòng nhập chẩn đoán bệnh án.");
            return;
        }

        setSubmittingRecord(true);
        try {
            // 1. Create medical record
            const patientId = appointment.userId;
            const recordRes = await api.post("/doctor/medical-records", {
                appointmentId,
                userId: patientId,
                diagnosis: diagnosis.trim(),
                notes: notes.trim()
            });
            const medicalRecordId = recordRes.data.record.id;

            // 2. Add prescriptions if any
            for (const rx of prescriptions) {
                if (rx.medicationName.trim()) {
                    await api.post("/doctor/prescriptions", {
                        medicalRecordId,
                        medicationName: rx.medicationName.trim(),
                        dosage: rx.dosage.trim(),
                        frequency: rx.frequency.trim(),
                        duration: rx.duration.trim()
                    });
                }
            }

            // 3. Mark appointment as COMPLETED
            await api.put(`/doctor/appointments/${appointmentId}/status`, {
                status: "COMPLETED",
                notes: "Khám trực tuyến hoàn tất, đã lập bệnh án và đơn thuốc."
            });

            toast.success("Lập bệnh án và hoàn thành ca khám thành công!");
            
            // Notify patient via socket
            if (socketRef.current) {
                socketRef.current.emit("end-call", { appointmentId });
            }

            cleanupCall();
            router.push("/doctor/appointments");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Lưu bệnh án thất bại.");
        } finally {
            setSubmittingRecord(false);
        }
    };

    // Render loading & error states
    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white"><LoadingSpinner className="w-10 h-10 text-teal-500" /></div>;
    if (error) return (
        <div className="h-screen flex items-center justify-center bg-slate-950 p-6">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-white">
                <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Không thể vào phòng khám</h2>
                <p className="text-sm text-slate-400 mb-6">{error}</p>
                <Button variant="teal" onClick={() => router.back()} className="w-full rounded-xl">Quay lại</Button>
            </div>
        </div>
    );

    // Dynamic UI labels based on role
    const otherPartyName = user?.role === "DOCTOR" 
        ? appointment?.user?.fullName || "Bệnh nhân" 
        : appointment?.doctor?.name || "Bác sĩ Chuyên khoa";

    return (
        <div className="h-screen flex flex-col bg-slate-950 text-white font-sans overflow-hidden">
            {/* Topbar */}
            <header className="h-16 shrink-0 bg-slate-900/60 border-b border-slate-800/80 px-6 flex items-center justify-between backdrop-blur-md z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                        <Activity className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-wide">PHÒNG KHÁM TELEMEDICINE</h1>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-teal-400" /> 
                            Lịch hẹn: {new Date(appointment.appointmentDate).toLocaleString("vi-VN")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                        connectionStatus === "connected" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        connectionStatus === "waiting" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse" :
                        "bg-slate-800 text-slate-400 border-slate-700"
                    }`}>
                        {connectionStatus === "connected" ? "Đã kết nối" :
                         connectionStatus === "waiting" ? "Đang chờ kết nối..." : "Đang tải phòng..."}
                    </span>
                    <span className="text-xs text-slate-400 hidden md:inline-block">|</span>
                    <span className="text-xs font-semibold text-slate-300 hidden md:inline-block">Đối phương: {otherPartyName}</span>
                </div>
            </header>

            {/* Main Area */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                
                {/* Left Stream Section */}
                <div className="flex-1 bg-slate-900 flex flex-col relative overflow-hidden min-h-[300px]">
                    {/* Remote Screen */}
                    <div className="flex-1 w-full h-full relative bg-slate-950 flex items-center justify-center">
                        {remoteStream ? (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-slate-500 px-6 text-center">
                                <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
                                    <User className="w-10 h-10 text-slate-600 animate-pulse" />
                                </div>
                                <h3 className="font-bold text-slate-300">Đang chờ đối phương vào phòng...</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-xs">Ca khám trực tuyến sẽ tự động bắt đầu khi cả hai bên đều online.</p>
                            </div>
                        )}

                        {/* Local PIP Video */}
                        <div className="absolute bottom-4 right-4 w-32 h-44 sm:w-44 sm:h-56 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 transition-all hover:scale-105 z-10">
                            {!isVideoOff ? (
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover transform -scale-x-100"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500 text-center px-2">
                                    <VideoOff className="w-6 h-6 mb-1 text-slate-600" />
                                    <span className="text-[10px] font-semibold">Camera Tắt</span>
                                </div>
                            )}
                            <div className="absolute top-2 left-2 bg-slate-950/70 backdrop-blur text-[10px] px-1.5 py-0.5 rounded font-semibold text-slate-300">
                                Tôi
                            </div>
                        </div>
                    </div>

                    {/* Bottom Controls Bar */}
                    <div className="h-20 shrink-0 bg-slate-950 flex items-center justify-center gap-4 px-6 border-t border-slate-900 z-10">
                        <button
                            onClick={toggleMute}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                isMuted ? "bg-red-500/20 text-red-500 border border-red-500/40 hover:bg-red-500/30" : "bg-slate-850 border border-slate-800 text-white hover:bg-slate-800"
                            }`}
                            title={isMuted ? "Mở Mic" : "Tắt Mic"}
                        >
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        <button
                            onClick={toggleVideo}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                isVideoOff ? "bg-red-500/20 text-red-500 border border-red-500/40 hover:bg-red-500/30" : "bg-slate-850 border border-slate-800 text-white hover:bg-slate-800"
                            }`}
                            title={isVideoOff ? "Bật Camera" : "Tắt Camera"}
                        >
                            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </button>

                        <button
                            onClick={handleEndCall}
                            className="w-16 h-12 rounded-2xl flex items-center justify-center bg-red-650 text-white hover:bg-red-750 transition-all shadow-lg shadow-red-500/10 border border-red-500/30"
                            title="Rời phòng khám"
                        >
                            <PhoneOff className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Right Panel Section */}
                <div className="w-full lg:w-[400px] border-t lg:border-t-0 lg:border-l border-slate-850 bg-slate-900/40 backdrop-blur-md flex flex-col shrink-0 overflow-hidden h-[350px] lg:h-full">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-850 shrink-0">
                        <button
                            onClick={() => setActiveTab("chat")}
                            className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
                                activeTab === "chat" ? "border-b-2 border-teal-500 text-teal-400 bg-slate-900/50" : "text-slate-400 hover:text-white"
                            }`}
                        >
                            <MessageSquare className="w-4 h-4" /> Trò chuyện
                        </button>
                        
                        {user?.role === "DOCTOR" && (
                            <button
                                onClick={() => setActiveTab("medical")}
                                className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
                                    activeTab === "medical" ? "border-b-2 border-teal-500 text-teal-400 bg-slate-900/50" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                <FileText className="w-4 h-4" /> Bệnh án & Đơn thuốc
                            </button>
                        )}
                    </div>

                    {/* Tab Contents */}
                    <div className="flex-1 overflow-y-auto flex flex-col bg-slate-900/20">
                        {activeTab === "chat" ? (
                            <>
                                {/* Chat Messages */}
                                <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
                                    {messages.length === 0 ? (
                                        <div className="text-center text-slate-500 text-xs py-10">
                                            Chưa có tin nhắn nào. Hãy gửi lời chào đến đối phương!
                                        </div>
                                    ) : (
                                        messages.map((msg, idx) => {
                                            const isMe = msg.sender === (user?.fullName || "Tôi");
                                            return (
                                                <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                                    <div className="text-[10px] text-slate-500 mb-0.5 px-1">{msg.sender}</div>
                                                    <div className={`px-3 py-2 rounded-2xl max-w-[280px] text-sm break-words ${
                                                        isMe ? "bg-teal-650 text-white rounded-br-sm shadow-sm shadow-teal-500/10" : "bg-slate-800 text-slate-200 rounded-bl-sm"
                                                    }`}>
                                                        {msg.text}
                                                    </div>
                                                    <div className="text-[9px] text-slate-500 mt-0.5 px-1">{msg.time}</div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Chat Input */}
                                <div className="p-3 bg-slate-900 border-t border-slate-850 shrink-0">
                                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 focus-within:border-teal-500 transition-colors">
                                        <input
                                            type="text"
                                            placeholder="Nhập tin nhắn..."
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") sendChatMessage();
                                            }}
                                            className="flex-1 bg-transparent border-none outline-none text-xs px-2"
                                        />
                                        <button
                                            onClick={sendChatMessage}
                                            className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 transition-colors"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Doctor Form */
                            <div className="p-4 space-y-4">
                                {/* Patient Medical Background Summary */}
                                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                                    <div className="flex items-center gap-1.5 text-teal-400 font-bold text-xs uppercase tracking-wider border-b border-slate-850 pb-1.5">
                                        <Activity className="w-3.5 h-3.5" />
                                        Hồ sơ y tế bệnh nhân
                                    </div>
                                    <div className="space-y-1.5 text-[11px] text-slate-300">
                                        <p>Nhóm máu: <strong className="text-white">{appointment?.user?.bloodType || "Chưa cập nhật"}</strong></p>
                                        <p>Tiền sử dị ứng: <strong className="text-white">{appointment?.user?.allergies || "Chưa cập nhật"}</strong></p>
                                        <p>Bệnh mãn tính: <strong className="text-white">{appointment?.user?.chronicDiseases || "Chưa cập nhật"}</strong></p>
                                        <div>
                                            <span className="text-slate-400 block font-semibold">Tiền sử bản thân:</span>
                                            <span className="text-white block mt-0.5 whitespace-pre-wrap">{appointment?.user?.personalHistory || "Chưa cập nhật"}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block font-semibold">Tiền sử gia đình:</span>
                                            <span className="text-white block mt-0.5 whitespace-pre-wrap">{appointment?.user?.familyHistory || "Chưa cập nhật"}</span>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSaveMedicalRecord} className="space-y-4 pt-2 border-t border-slate-850">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Chẩn đoán bệnh *</label>
                                    <textarea
                                        value={diagnosis}
                                        onChange={(e) => setDiagnosis(e.target.value)}
                                        placeholder="Nhập chẩn đoán lâm sàng..."
                                        required
                                        className="w-full min-h-[60px] p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none focus:border-teal-500 transition-colors text-white resize-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Ghi chú điều trị / Lời dặn</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Nhập ghi chú thêm cho bệnh nhân..."
                                        className="w-full min-h-[60px] p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none focus:border-teal-500 transition-colors text-white resize-none"
                                    />
                                </div>

                                {/* Prescription Section */}
                                <div className="space-y-2 pt-2 border-t border-slate-850">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Kê đơn thuốc</label>
                                        <button
                                            type="button"
                                            onClick={addPrescriptionRow}
                                            className="flex items-center gap-0.5 text-[10px] font-semibold text-teal-400 hover:text-teal-300 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" /> Thêm thuốc
                                        </button>
                                    </div>

                                    {prescriptions.length === 0 ? (
                                        <p className="text-[10px] text-slate-500 italic">Chưa kê đơn thuốc nào.</p>
                                    ) : (
                                        <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                                            {prescriptions.map((rx, idx) => (
                                                <div key={idx} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 relative space-y-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => removePrescriptionRow(idx)}
                                                        className="absolute top-2 right-2 text-red-500 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>

                                                    <div className="space-y-1">
                                                        <input
                                                            type="text"
                                                            placeholder="Tên thuốc *"
                                                            value={rx.medicationName}
                                                            onChange={(e) => updatePrescriptionField(idx, "medicationName", e.target.value)}
                                                            className="w-[85%] bg-transparent border-b border-slate-800 focus:border-teal-500 text-xs py-0.5 outline-none font-bold"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <span className="text-[9px] text-slate-500 block">Liều lượng</span>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. 500mg"
                                                                value={rx.dosage}
                                                                onChange={(e) => updatePrescriptionField(idx, "dosage", e.target.value)}
                                                                className="w-full bg-transparent border-b border-slate-800 text-[10px] py-0.5 outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] text-slate-500 block">Tần suất</span>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. 2 lần/ngày"
                                                                value={rx.frequency}
                                                                onChange={(e) => updatePrescriptionField(idx, "frequency", e.target.value)}
                                                                className="w-full bg-transparent border-b border-slate-800 text-[10px] py-0.5 outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] text-slate-500 block">Số ngày</span>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. 7 ngày"
                                                                value={rx.duration}
                                                                onChange={(e) => updatePrescriptionField(idx, "duration", e.target.value)}
                                                                className="w-full bg-transparent border-b border-slate-800 text-[10px] py-0.5 outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        variant="teal"
                                        disabled={submittingRecord}
                                        className="w-full rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/10"
                                    >
                                        {submittingRecord ? (
                                            <>
                                                <LoadingSpinner className="w-3.5 h-3.5 text-white" />
                                                Đang lưu bệnh án...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                Hoàn thành & Kê đơn
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
