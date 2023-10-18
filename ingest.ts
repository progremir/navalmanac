import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders";
import * as fs from 'fs';

const id = '5869e92d-3efc-47db-9b4a-35fae9b41541';
const filePath = 'restaurants.json';

export const run = async () => {
  const restaurant = await findRestaurantById(id, filePath)
  if (!restaurant) {
    console.log("invalid ID")
    return
  }

  const loader = new PDFLoader(restaurant.filename);
  const rawDocs = await loader.load();
  console.log("Loader created.");
  /* Split the text into chunks */
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await textSplitter.splitDocuments(rawDocs);
  console.log("Docs splitted.");

  console.log("Creating vector store for with index ID:", id, restaurant.name);
  /* Create the vectorstore */
  const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
   
  await vectorStore.save(id.toString());
};

interface Restaurant {
  id: string;
  name: string;
  filename: string;
}

async function findRestaurantById(idToFind: string, filePath: string): Promise<Restaurant | null> {
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    const restaurants: Restaurant[] = JSON.parse(data);
    const foundRestaurant = restaurants.find((restaurant) => restaurant.id === idToFind);
    
    return foundRestaurant || null;
  } catch (error) {
    throw error;
  }
}

(async () => {
  await run();
  console.log("done");
})();
