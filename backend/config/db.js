import mongoose from "mongoose";

const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;

const initializeServer = async (app) => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected DB successfully");

    app.listen(PORT, () =>
      console.log(`Server is running on the port: ${PORT}`),
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export default initializeServer;
