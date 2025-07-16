import { Configuration, OpenAIApi } from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set');
}

const configuration = new Configuration({
  apiKey,
});

const openai = new OpenAIApi(configuration);

export default openai;
