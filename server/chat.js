import 'dotenv/config';
import readline from 'node:readline/promises';
import { answerQuestion } from './services/chat-service.js';

export async function chat() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    while (true) {
        const question = await rl.question('You: ');
        if (question === '/bye') {
            break;
        }

        const response = await answerQuestion(question);
        console.log(`Assistant: ${response.answer}`);
    }

    rl.close();
}

chat().catch((error) => {
    console.error(error.message);
});
