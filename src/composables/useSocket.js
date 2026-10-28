const base = import.meta.env?.v_BASE_SOCKET_URL;
const socket = new SockJS(`${base}/socket`);

const client = Stomp.over(socket);

export const useSocket = () => {

  function subscribe(name, cb) {
    if (!client.connected) {
      console.warn('[socket] subscribe skipped: not connected');
      return;
    }

    client.subscribe(name, cb);
  }

  function send(name, message) {
    client.send(name, {}, message);
  }

  async function unSub() {
    return new Promise((res) => {
      Object.keys((client?.subscriptions || {})).forEach(el => {
        client.unsubscribe(el);
      });
      res();
    });
  }

  async function connect() {
    return new Promise((res, rej) => {
      if (client?.connected) {
        return res({ client });
      }


      client.connect(
        {}, // Optional headers if needed
        function (frame) {
          // Connection was successful
          res({ client, frame });

          // Do something after the connection is made
          // All subscribes must be done in this callback
        },
        function (error) {
          // Connection error
          console.error('Connection error: ' + error);
          rej(error);
        }
      );
    });
  }

  return {
    connect,
    subscribe,
    client,
    unSub,
    send
  };
};
