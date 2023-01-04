#!/usr/bin/env python3

import bcrypt
import json
from enum import Enum

class Role(Enum):
    Admin = 0
    Guest = 1

class User:
    def __init__(self, name: str, pw: str) -> None:
        self.name = name
        self.pw = pw
        self.role = Role.Guest
        self.values = {}

    def set_admin_rights(self) -> None:
        self.role = Role.Admin

    def put_value(self, key: str, value: str) -> None:
        self.values[key] = value
    
    def get_value(self, key:str) -> str:
        return self.values[key]

    def add_values(self, newpairs: dict) -> None:
        self.values.update(newpairs)

    def __str__(self) -> str:
        return self.name + " " + self.pw + " " + self.role + " Data:" + self.values


def get_hashed_password(plainTextPass: str) -> str:
    plainTextPass = plainTextPass.encode('utf-8')
    return bcrypt.hashpw(plainTextPass, bcrypt.gensalt()).decode('utf-8')

def check_password(plainTextPass: str, hashedPass: str) -> bool:
    return bcrypt.checkpw(plainTextPass.encode('utf-8'), hashedPass.encode('utf-8'))

def add_user_and_pass(userName: str, hashedPass: str) -> None:
    with open("Names.json", "r") as f:
        data = json.load(f)
    data[userName] = hashedPass
    with open("Names.json", "w+") as f:
        json.dump(data, f)

def get_pass_by_username(user: str) -> str:
    with open("Names.json", "r") as f:
        data = json.load(f)    
    return data[user]

def get_user_and_pass() -> dict:
    with open("Names.json", "r") as f:
        data = json.load(f)
    return data

if __name__ == "__main__":
    print("Add Username and Password:")
    user = input("Username:")
    pw = input("Password:")
    hashedpw = get_hashed_password(pw)
    add_user_and_pass(user, hashedpw)