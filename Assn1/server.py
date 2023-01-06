#!/usr/bin/env python3

import socket
import logging
from utility import *
from threading import Thread


def server_init(c: socket.socket, user_mapping: dict, userName: str):
    logging.basicConfig(format='%(asctime)s - %(message)s',
                        level=logging.INFO, datefmt='[%d-%b-%y %H:%M:%S]')
    while True:
        command = c.recv(2048).decode("utf-8").split(" ")
        match command[0]:
            case "get":
                logging.log(20, " ".join(command) + f" - {userName}")
                li = []
                for i in command[1:]:
                    try:
                        li.append(user_mapping[userName].get_value(i))
                    except KeyError as e:
                        logging.error(e)
                        continue
                c.send(li.__str__().encode("utf-8"))
            case "getall":
                logging.log(20, " ".join(command) + f" - {userName}")
                if userName == "debarghya" or user_mapping[userName].role == Role.Admin:
                    all_values = {}
                    for user, userObj in user_mapping.items():
                        all_values[user] = userObj.values
                    c.send(all_values.__str__().encode("utf-8"))
                else:
                    c.send(b"Not admin.")
            case "put":
                logging.log(20, " ".join(command) + f" - {userName}")
                if len(command[1:]) % 2 != 0:
                    c.send(b"Invalid arguments")
                else:
                    pairs = command[1:]
                    pairs = [(pairs[i], pairs[i+1])
                             for i in range(0, len(pairs)-1, 2)]
                    pairs = dict(pairs)
                    user_mapping[userName].add_values(pairs)
                    c.send(b"Successfully added values")
            case "set_admin":
                logging.log(20, " ".join(command) + f" - {userName}")
                if len(command) != 2 or command[1] not in user_mapping.keys():
                    c.send(b"Invalid arguments/username")
                elif command[1] == "debarghya" or user_mapping[command[1]].role == Role.Admin:
                    try:
                        user_mapping['debarghya'].set_admin_rights()
                    except KeyError:
                        pass
                    c.send(b"Already admin.")
                else:
                    c.send(b"Enter admin password:")
                    pw = c.recv(1024).decode('utf-8')
                    if check_password(pw, user_mapping["debarghya"].pw):
                        user_mapping[command[1]].set_admin_rights()
                        c.send(b"Made admin")
                    else:
                        c.send(b"Password incorrect. Cannot make admin.")
            case "close":
                logging.log(20, " ".join(command) + f" - {userName}")
                c.send(b"Connection closed.")
                c.close()
                break
            case _:
                logging.log(40, " ".join(command) + f" - {userName}")
                c.send(b"Invalid command/arguments")


if __name__ == "__main__":
    data = get_user_and_pass()
    user_mapping = dict()
    for u, p in data.items():
        userObj = User(u, p)
        user_mapping[u] = userObj
    # server_init(user_mapping)
    logging.basicConfig(format='%(asctime)s - %(message)s',
                        level=logging.INFO, datefmt='[%d-%b-%y %H:%M:%S]')
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("", 9999))
    s.listen(10)
    print(f"Server is up and running at: {('0.0.0.0', 9999)}")
    while True:
        conn, addr = s.accept()
        logging.log(20, f"New connection from {addr}")
        data = conn.recv(1024).decode("utf-8").split(" ")
        logging.log(20, data)
        if check_password(data[1], get_pass_by_username(data[0])):
            thread = Thread(target=server_init, args=(
                conn, user_mapping, data[0]), daemon=True)
            thread.start()
        else:
            conn.close()
