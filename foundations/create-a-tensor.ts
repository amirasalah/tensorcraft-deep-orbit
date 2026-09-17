const streamValues = [0.12, 0.94, 0.31, 0.88, 0.47];

const reading = tf.tensor(streamValues, [streamValues.length]);
const shape = reading.shape;
const values = Array.from(reading.dataSync());
const total = tf.tidy(() => reading.sum().dataSync()[0]);

reading.dispose();