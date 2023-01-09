#!/usr/bin/env python3

import socket
import argparse

def init_client(host, port, user, pw):
    c = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    c.connect((host, port))
    c.send(f"{user} {pw}".encode('utf-8'))
    try:
        while True:
            command = input("> ")
            if command == "":
                continue
            c.send(command.encode('utf-8'))
            if command.startswith("set_admin"):
                recvd = c.recv(1024).decode("utf-8")
                if recvd == "Enter admin password:":
                    pw = input(recvd)
                    c.send(pw.encode('utf-8'))
                    print(c.recv(1024).decode('utf-8'))
                else:
                    print(recvd)
            elif command.startswith("close"):
                print(c.recv(1024).decode('utf-8'))
                c.close()
                break
            else:
                print(c.recv(1024).decode("utf-8"))
    except ConnectionRefusedError:
        print("Username/Password is incorrect.\nConnection terminated")
    except Exception as err:
        print(err)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Send, receive TCP connection')
    parser.add_argument('--host', type=str, default="127.0.0.1", help='Specify Host (default localhost)', required=False)
    parser.add_argument('--port', type=int, default=9999, help='TCP port (default 9999)', required=False)
    parser.add_argument('-u', metavar='username', type=str, help='Specify Username', required=True)
    parser.add_argument('-p', metavar='password', type=str, help='Specify Password', required=True)
    args = parser.parse_args()
    init_client(args.host, args.port, args.u, args.p)