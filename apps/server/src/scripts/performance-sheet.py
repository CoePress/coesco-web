import sys
import json

def main():
    data = json.load(sys.stdin)
    print(json.dumps(data.get("data", {})))

if __name__ == "__main__":
    main()
