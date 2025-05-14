import Deepgram from '@deepgram/sdk';
console.log('Deepgram.Deepgram:', Deepgram.Deepgram);
const DG = Deepgram.Deepgram;
console.log('DG type:', typeof DG);
if (typeof DG === 'function') {
  console.log('DG is a constructor function/class');
}