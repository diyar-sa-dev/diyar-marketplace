import socket

host = "195.200.14.40"
ports = [22, 80, 443, 8080, 8093, 8000, 3306, 6379, 8443, 8090, 8088, 8092]
print("host", host)
for p in ports:
    s = socket.socket()
    s.settimeout(2.0)
    try:
        s.connect((host, p))
        print(f"{p}\tOPEN")
    except socket.timeout:
        print(f"{p}\tTIMEOUT")
    except Exception as e:
        print(f"{p}\tFAIL {type(e).__name__}")
    finally:
        s.close()
