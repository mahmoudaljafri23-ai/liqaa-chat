const io = require('socket.io-client');
const socket = io('https://liqaa-chat.onrender.com');

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('find_partner', { username: 'TestName' });
});

socket.on('waiting', () => {
  console.log('Waiting...');
  setTimeout(() => process.exit(0), 2000);
});

socket.on('matched', (data) => {
  console.log('Matched:', data);
  process.exit(0);
});
