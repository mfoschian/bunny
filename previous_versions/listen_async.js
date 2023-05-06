let amqp = require('amqplib');

const queue_name = 'seme';
const connection_info = {
	// protocol: 'amqp',
	// port: 5672,
	hostname: '172.18.35.42',
	vhost: 'psap2',
	username: 'psap2',
	password: 'psap2'
};

function onMessage(msg) {
	if (msg.content) {
		console.log(" [x] %s", msg.content.toString());
	}
	else
		console.log(" [x] <message without content>");
}


// listening
async function listen() {
	try {
		let connection = await amqp.connect(connection_info);

		let channel = await connection.createChannel();

		const queue_opts = {
			durable: true,
			exclusive: false
		};

		let q = await channel.assertQueue(queue_name, queue_opts);

		channel.consume(q.queue, function (msg) {
			if (msg.content && msg.content.toString() == 'bye') {
				console.log('Bye, bye')
				connection.close();
			}
			else
				onMessage(msg);
		}, { noAck: true });
	}
	catch( e ) {
		console.error( e );
	}
}


async function run() {
	console.log('Listening...')
	await listen();
}

run();