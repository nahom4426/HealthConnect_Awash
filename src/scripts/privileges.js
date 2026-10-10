import jwt from "vue-jwt-decode";
import * as session from "@/scripts/session";

function getAccessToken() {
  const user = session.getUser(); // Access the Pinia store
  return user.accessToken;
}

const getPrivileges = async () => {
  const token = getAccessToken();
  const decodedToken = jwt.decode(token);
  const privileges = decodedToken.privileges;

  return decodedToken;
};

export { getPrivileges };
