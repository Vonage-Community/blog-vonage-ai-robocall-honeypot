import Express from 'express';
import debug from 'debug';
import { Vonage } from '@vonage/server-sdk';
import { WhatsAppText } from '@vonage/messages';
import { readFileSync } from 'fs';

const log = debug('robot:server');

const FROM_NUMBER = process.env.FROM_NUMBER;
const MY_NUMBER = process.env.MY_NUMBER;


const key = readFileSync('./private.key').toString();

const client = new Vonage(
    {
        apiKey: process.env.VONAGE_API_KEY,
        apiSecret: process.env.VONAGE_API_SECRET,
        applicationId: process.env.VONAGE_APPLICATION_ID,
        privateKey: key,
        
    },
)

const app = new Express();
const port = process.env.PORT || 3000;

// Catch promises
const catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

app.use(Express.json());

const contactNumbers = [
    {phone: '19999999991', record: false},
];

const numbersToAdd = [];

// Setup endpoint
app.post('/contacts', catchAsync(async (req, res) => {
    const { caller } = req.body;
    log(`Checking ${caller}`, contactNumbers);
    const contact = contactNumbers.find(({phone}) => `${caller}` === `${phone}`);

    log(`search result`, contact);

    if (contact) {
        log('Contact in list');
        res.status(200).json(contact);
        return
    }

    log('Contact not found');
    res.status(404).json({record: true});
}));

app.post('/status', catchAsync(async (req, res) => {
    log('Status', req.body);
    res.status(200).json({ok: true});
}));

app.post('/inbound', catchAsync(async (req, res) => {
    log('Inbound', req.body);

    const {text} = req.body;
    if (text.toLowerCase() === 'add') {
        contactNumbers.push({
            phone: `${numbersToAdd[0]}`,
            record: false,
        });
        numbersToAdd.pop();
        log(contactNumbers);
        log(numbersToAdd);
    }
    res.status(200).json({ok: true});
}));

app.post('/add', catchAsync(async (req, res) => {
    const { caller } = req.body;
    const found = numbersToAdd.find((number) => caller == number);
    if (!found) {
        log(`Queueing ${caller} to add`);
        numbersToAdd.push(caller);

        try {
            await client.messages.send(new WhatsAppText({
                from: FROM_NUMBER,
                to: MY_NUMBER,
                text: `New Contact to add ${caller}`
            })); 
            log('Message sent');
        } catch (e) {
            log('Error sending message', e);
        }
    }

    log(`Numbers to add`, numbersToAdd);
    res.status(200).json({added: true});
}));

// Setup a 404 handler
app.all('*', (req, res) => {
    res.status(404).json({
        status: 404,
        title: 'Not Found',
    });
});

// Setup an error handler
app.use((err, req, res, next) => {
    res.status(500).json({
        status: 500,
        title: 'Internal Server Error',
        detail: err.message,
    });
});
  
// Start Express
app.listen(port, () => {
    console.log(`app listening on port ${port}`);
});
