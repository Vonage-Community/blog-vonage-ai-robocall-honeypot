import Express from 'express';
import path from 'path';

const app = new Express();
const port = process.env.PORT || 3000;

// Catch promises
const catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

app.use(Express.json());

const contactNumbers = [
    {phone: '19999999991', record: false},
    {phone: '19999999992', record: false},
];

// Setup endpoint
app.post('/contact', catchAsync(async (req, res) => {
    const { caller } = req.body;
    const contact = contactNumbers.find(({phone}) => caller);

    if (contact) {
        res.status(200).json(contact);
        return
    }

    res.status(404).json({record: true});
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
    log(`app listening on port ${port}`);
});