import os
import sys

# Read key project files and output their content
files_to_read = [
    "USE_CASES_SYNTHESIS.md",
    "BUG_REPORT.md",
    "backend/src/services/auth.service.ts",
    "backend/src/controllers/appointment.controller.ts",
    "backend/src/services/appointment.service.ts",
    "backend/src/services/payment.service.ts",
    "backend/src/controllers/payment.controller.ts",
    "frontend/src/components/common/ProtectedRoute.tsx",
    "frontend/src/app/admin/layout.tsx",
    "frontend/src/app/my-appointments/page.tsx",
    "frontend/src/app/messages/page.tsx",
]

base_path = r"c:\Users\MY HP\Documents\KY5\SWP391\BAINHOM\swp391-rbl-project-team_1"

results = []
for f in files_to_read:
    full_path = os.path.join(base_path, f)
    if os.path.exists(full_path):
        try:
            with open(full_path, 'r', encoding='utf-8') as fp:
                content = fp.read()
            results.append(f"=== {f} ===\n{content[:5000]}\n\n")
        except Exception as e:
            results.append(f"=== {f} === ERROR: {e}\n\n")
    else:
        results.append(f"=== {f} === FILE NOT FOUND\n\n")

output = "\n".join(results)
with open(os.path.join(base_path, "files_output.txt"), "w", encoding="utf-8") as out:
    out.write(output)

print("Done. Check files_output.txt")
print(f"Total files processed: {len(files_to_read)}")
print("File existence check:")
for f in files_to_read:
    full_path = os.path.join(base_path, f)
    print(f"  {f}: {os.path.exists(full_path)}")