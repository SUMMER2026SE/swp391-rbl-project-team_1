"use client";

interface LocationMapProps {
  className?: string;
}

export default function LocationMap({
  className = "w-full h-full min-h-[400px] rounded-3xl",
}: LocationMapProps) {
  return (
    <div className={`${className} overflow-hidden shadow-lg`}>
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.1138489419113!2d108.20727901092206!3d16.05958083963151!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219b5975f39a7%3A0x9c707018713f82ee!2zQuG7h25oIHZp4buHbiBIb8OgbiBN4bu5IMSQw6AgTuG6tW5n!5e0!3m2!1svi!2s!4v1784086164897!5m2!1svi!2s"
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: "inherit" }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        title="Bệnh viện Hoàn Mỹ Đà Nẵng"
      />
    </div>
  );
}
