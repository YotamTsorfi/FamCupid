An .env file is required in both Server Side And Client Side.

Initially, the application connects to the database, which is hosted in the cloud using Atlas.

Apart from the need for a CONNECTING_STRING (.env), 
the database is configured to work only from a specific IP address.

Authentication Process
You can log in using a Google account or a Facebook account. 
Currently, it's configured only for test users because the application hasn't been published yet.
However, you can also manually register with a username and password.

Image Storage
Each user can store images. 
The images are saved in the cloud on AWS in an S3 bucket. 
For each user, a folder named after their ID is created, and all images are stored within this folder.
I have configured access to the S3 storage and set external restrictions.

System Connection
The connection to the system is made via API calls, 
but all communication—private messages between users, group messages, 
and all other operations—are implemented using WebSocket.


Project Short Clip
https://youtu.be/hPE_o1Ux20M