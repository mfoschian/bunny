let amqp = require('amqplib/callback_api');

const exchange_name = 'cards';
const connect_url = "amqp://psap2:psap2@172.18.35.42/psap2";
const default_timeout = 5; // seconds

// Emit
async function emit(message) {
	return new Promise((resolve, reject) => {
		let channel = null;
		let connection = null;

		amqp.connect(connect_url, function (error0, cnn) {
			if (error0) {
				reject(error0);
				return;
			}

			connection = cnn;

			let timeout_id = null;
			const close = (err, res) => {
				if( timeout_id != null )
					clearTimeout(timeout_id);

				if( channel ) {
					console.log('Closing channel');
					channel.close( () => {
						connection.close();
						connection = null;
					});
					resolve(res);
				}
				else {					
					console.log('Closing connection');
					connection.close();
					connection = null;
					if( err )
						reject(err);
					else
						resolve(res);
				}
			};

			timeout_id = setTimeout(() => close('Connection timed out'), default_timeout * 1000);

			connection.createChannel(function (error1, ch) {
				if (error1) {
					close(error1);
					return;
				}
				
				channel = ch;

				const exchange_opts = {
					durable: true
				};
				channel.assertExchange(exchange_name, 'fanout', exchange_opts, function(errorx, exc) {

					if( errorx ) {
						close(errorx);
						return;
					}

					const result = channel.publish(exchange_name, '', Buffer.from(message), {persistent: true});

					if( result != true ) {
						// Must wait the drain event
						console.log('waiting drain');
						channel.once('drain', () => close(null, true));
					}
					else {
						close(null, result);
					}

				});

			});


		});
	})
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