const { io } = require('socket.io-client');

const SERVER_URL = 'https://liqaa-chat.onrender.com';
console.log('Testing live matching on:', SERVER_URL);

const socket1 = io(SERVER_URL, { transports: ['polling', 'websocket'], timeout: 20000 });
const socket2 = io(SERVER_URL, { transports: ['polling', 'websocket'], timeout: 20000 });

socket1.on('connect', () => {
  console.log('[Socket 1] Connected:', socket1.id);
  socket1.emit('register', {
    gender: 'male',
    myCountry: 'JO',
    targetCountry: 'ALL',
    country: 'ALL',
    genderFilter: 'any',
    username: 'Device1'
  });

  setTimeout(() => {
    console.log('[Socket 1] Searching for partner...');
    socket1.emit('find_partner', {
      gender: 'male',
      myCountry: 'JO',
      targetCountry: 'ALL',
      genderFilter: 'any',
      username: 'Device1'
    });
  }, 1000);
});

socket1.on('matched', (data) => {
  console.log('[Socket 1] MATCHED SUCCESS! Partner:', data.partnerUsername, 'ID:', data.partnerId);
});

socket1.on('waiting', () => {
  console.log('[Socket 1] Waiting in queue...');
});

socket2.on('connect', () => {
  console.log('[Socket 2] Connected:', socket2.id);
  socket2.emit('register', {
    gender: 'female',
    myCountry: 'JO',
    targetCountry: 'ALL',
    country: 'ALL',
    genderFilter: 'any',
    username: 'Device2'
  });

  setTimeout(() => {
    console.log('[Socket 2] Searching for partner...');
    socket2.emit('find_partner', {
      gender: 'female',
      myCountry: 'JO',
      targetCountry: 'ALL',
      genderFilter: 'any',
      username: 'Device2'
    });
  }, 2000);
});

socket2.on('matched', (data) => {
  console.log('[Socket 2] MATCHED SUCCESS! Partner:', data.partnerUsername, 'ID:', data.partnerId);
  setTimeout(() => {
    console.log('🎉 MATCHMAKING WORKS 100% ON LIVE SERVER!');
    process.exit(0);
  }, 1000);
});

socket2.on('waiting', () => {
  console.log('[Socket 2] Waiting in queue...');
});

socket1.on('connect_error', (err) => {
  console.error('[Socket 1 Connect Error]', err.message);
});

socket2.on('connect_error', (err) => {
  console.error('[Socket 2 Connect Error]', err.message);
});

setTimeout(() => {
  console.error('TIMEOUT: 25 seconds elapsed');
  process.exit(1);
}, 25000);
