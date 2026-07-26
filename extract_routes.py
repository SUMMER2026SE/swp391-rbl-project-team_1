import os
import re

routes_dir = r"c:\Users\MY HP\Documents\KY5\SWP391\BAINHOM\swp391-rbl-project-team_1\backend\src\routes"

if not os.path.exists(routes_dir):
    print("Routes directory not found")
    sys.exit(1)

route_files = [f for f in os.listdir(routes_dir) if f.endswith(".routes.ts")]

print(f"Found {len(route_files)} route files:")

all_routes_info = []

for rf in route_files:
    path = os.path.join(routes_dir, rf)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    print(f"\n=== File: {rf} ===")
    
    # Let's extract lines that look like router.get, router.post, router.put, router.delete, router.patch
    matches = re.findall(r"router\.(get|post|put|delete|patch)\(([^)]+)\)", content)
    
    for method, args in matches:
        args_list = [a.strip() for a in args.split(",")]
        endpoint = args_list[0].replace('"', '').replace("'", "")
        middleware = args_list[1:-1]
        handler = args_list[-1]
        
        print(f"{method.upper()} {endpoint}")
        print(f"  Middleware: {middleware}")
        print(f"  Handler: {handler}")
        
        all_routes_info.append({
            "file": rf,
            "method": method.upper(),
            "endpoint": endpoint,
            "middleware": middleware,
            "handler": handler
        })

# Let's also search if there are general middleware applied at the router level, e.g. router.use(...)
for rf in route_files:
    path = os.path.join(routes_dir, rf)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    uses = re.findall(r"router\.use\(([^)]+)\)", content)
    if uses:
        print(f"\nRouter level use in {rf}: {uses}")

with open(r"c:\Users\MY HP\Documents\KY5\SWP391\BAINHOM\swp391-rbl-project-team_1\extracted_routes.txt", "w", encoding="utf-8") as out:
    for r in all_routes_info:
        out.write(f"File: {r['file']}\n")
        out.write(f"Method: {r['method']}\n")
        out.write(f"Endpoint: {r['endpoint']}\n")
        out.write(f"Middleware: {', '.join(r['middleware'])}\n")
        out.write(f"Handler: {r['handler']}\n")
        out.write("-" * 40 + "\n")