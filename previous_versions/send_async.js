let amqp = require('amqplib');

const exchange_name = 'cards';
const connection_info = {
	// protocol: 'amqp',
	// port: 5672,
	hostname: '172.18.35.42',
	vhost: 'psap2',
	username: 'psap2',
	password: 'psap2'
};

const default_timeout = 5; // seconds

// Emit
async function emit(message) {
	let connection = null;
	let timeout_id = null;
	let channel = null;

	const close = async () => {
		if( timeout_id != null )
			clearTimeout(timeout_id);

		if( channel ) {
			console.log('Closing channel');
			await channel.close();
			channel = null;
		}

		console.log('Closing connection');
		await connection.close();
		connection = null;
	};

	try {
		connection = await amqp.connect(connection_info);

		timeout_id = setTimeout(() => {
			console.error('Connection timed out');
			close()
		}, default_timeout * 1000);

		channel = await connection.createChannel();

		const exchange_opts = {
			durable: true
		};

		await channel.assertExchange(exchange_name, 'fanout', exchange_opts);

		const result = channel.publish(exchange_name, '', Buffer.from(message), {persistent: true});
		if( result != true ) {
			// Must wait the drain event
			console.log('waiting drain');
			await new Promise((resolve) => channel.once('drain', () => resolve()));
		}

		await close();
		return true;
	}
	catch( err ) {
		console.error( err );
		await close();
		return false;
	}
}


async function run() {
	try {
		const message = process.argv.slice(2).join(' ') || 'Hello World!';
		const result = await emit(message)
		console.log( "Sent message: '%s', result is %s", message, result);
	}
	catch (e) {
		console.error('Error sending message:');
		console.error(e);
	}

}

run();