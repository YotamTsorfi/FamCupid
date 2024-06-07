import io from "socket.io-client";

const ENDPOINT = process.env.REACT_APP_SOCKET_SERVER;
const socket = io(ENDPOINT);

export default socket;
