import asyncio
import websockets
import json
import zmq
import zmq.asyncio
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ZeroMQ context
ctx = zmq.asyncio.Context()

async def fetch_data(zmq_socket):
    """Asynchronously fetches data from ZeroMQ server and formats it."""
    try:
        # Fetch configuration
        await zmq_socket.send(b"config")
        config_data = await zmq_socket.recv()
        config = json.loads(config_data.decode("utf-8"))

        # Fetch values
        await zmq_socket.send(b"values")
        values_data = await zmq_socket.recv()
        values = json.loads(values_data.decode("utf-8"))

        # Format data
        formatted_data = {
            "configuration": config["config"],
            "values": {id: stats["inputstat"] for id, stats in values["values"].items()}
        }

        return json.dumps(formatted_data, indent=4)
    except zmq.ZMQError as e:
        logger.error(f"ZMQ Error: {e}")
        return json.dumps({"error": "Failed to fetch data from ZeroMQ server"})

async def websocket_handler(websocket, path):
    zmq_socket = ctx.socket(zmq.REQ)
    zmq_socket.connect("tcp://localhost:12720")
    try:
        while True:
            data = await fetch_data(zmq_socket)
            await websocket.send(data)
            await asyncio.sleep(0.3)  # Adjust the frequency as needed
    except websockets.exceptions.ConnectionClosed as e:
        logger.info("WebSocket connection closed")
    except Exception as e:
        logger.error(f"Unhandled exception: {e}")
    finally:
        zmq_socket.close()

async def main():
    websocket_server = await websockets.serve(websocket_handler, "0.0.0.0", 8765, ssl=None)  # Use ssl=context for wss
    await websocket_server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
