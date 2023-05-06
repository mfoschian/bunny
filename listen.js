const MQ = require('./bunny');

const connection_info = {
	// protocol: 'amqp',
	// port: 5672,
	hostname: '172.18.35.42',
	vhost: 'psap2',
	username: 'psap2',
	password: 'psap2'
};

let q = new MQ(connection_info);

q.on('error', (err) => {
	console.error(err);
});

q.on('message', (msg) => {
	if (!msg.content) {
		console.log(" [x] <message without content>");
		return;
	}

	const text = msg.content.toString();
	if (text == 'bye') {
		console.log('Bye, bye')
		q.disconnect();
		return;
	}

	console.log(" [x] %s", text);
});




async function run() {
	console.log('Listening...')
	await q.listen({
		name: 'seme',
		options: {
			durable: true,
			exclusive: false
		}
	});
}

run();