import Deepgram from '@deepgram/sdk';
console.log('Deepgram type:', typeof Deepgram);
console.log('Deepgram properties:', Object.getOwnPropertyNames(Deepgram));
console.log('Deepgram prototype:', Object.getOwnPropertyNames(Deepgram.prototype || {}));