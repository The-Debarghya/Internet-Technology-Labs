# Internet-Technology-Labs

### Assignments done in Internet Technology Lab of BCSE 6th Semester curricullum.

- Each one can be tested separately.

## How to test & Assignment Contents?

- `Assn1`: A Redis-Like commandline **Key-value pair** store. Users need to authenticate and interact with the server.
  - *How to simulate?*: First create a json file containing usernames and **Bcrypt hashed** passwords using _util.py_. Then run _server.py_ next test the server with _client.py_.
  - The server can handle at most **10** clients at the moment.
- `Assn2`: A file upload/download repository.
  - *How to simulate?*: If you want to build from source, use **docker compose up** and head over to localhost:3000 to use it. Else more info is <a href="https://github.com/The-Debarghya/file-store">here</a>.

* `N.B`: If you think this projects really work please give a star, this would really help else please open a PR/Issue, I'll try to solve; since our teachers are too dumb to understand mistakes and will relentlessly deduct marks.
