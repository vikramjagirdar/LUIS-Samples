// This loads the environment variables from the .env file
require('dotenv-extended').load();

const builder = require('botbuilder');
const restify = require('restify');
const Store = require('./store');
const spellService = require('./spell-service');

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 8080, () => {
    console.log(`${server.name} listening to ${server.url}`);
});
// Create connector and listen for messages
const connector = new builder.ChatConnector({
    // appId: process.env.MICROSOFT_APP_ID,
    // appPassword: process.env.MICROSOFT_APP_PASSWORD
    appId: null,
    appPassword: null
});
server.post('/api/messages', connector.listen());


// Default store: volatile in-memory store - Only for prototyping!
var inMemoryStorage = new builder.MemoryBotStorage();
var bot = new builder.UniversalBot(connector, function (session) {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
}).set('storage', inMemoryStorage); // Register in memory storage


// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
const recognizer = new builder.LuisRecognizer("https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/2acfc32a-8667-431b-80da-e60ef10ac430?subscription-key=9cd99bc8b2844b11b5ef6b5791a64b5b");
bot.recognizer(recognizer);




bot.dialog('yes_intent', [
    (session, args, next) => {
        console.log('Chekcing JMV');
        session.send(`Welcome to Hungry Belly,  We are analyzing your message: 'session.message.text'`);
        
        const cityEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.geography.city');
        const airportEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'AirportCode');
        if (cityEntity) {
            // city entity detected, continue to next step
            session.dialogData.searchType = 'city';
            next({ response: cityEntity.entity });
        } else if (airportEntity) {
            // airport entity detected, continue to next step
            session.dialogData.searchType = 'airport';
            next({ response: airportEntity.entity });
        } else {
            // no entities detected, ask user for a destination
            builder.Prompts.text(session, 'Please enter your destination');
        }
    },
    (session, results) => {
        const destination = results.response;
        let message = 'Looking for hotels';
        if (session.dialogData.searchType === 'airport') {
            message += ' near %s airport...';
        } else {
            message += ' in %s...';
        }
        session.send(message, destination);
        // Async search
        Store
            .searchHotels(destination)
            .then(hotels => {
                // args
                session.send(`I found ${hotels.length} hotels:`);
                let message = new builder.Message()
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(hotels.map(hotelAsAttachment));
                session.send(message);
                // End
                session.endDialog();
            });
    }
]).triggerAction({
    matches: 'yes_intent',
    onInterrupted:  session => {
        session.send('Please provide a destination');
    }
});

bot.dialog('show_food', (session, args) => {
    // retrieve hotel name from matched entities
    console.log("JMV inside intent");
    
    session.send(`Showing burgers and fries`);

}).triggerAction({
    matches: 'show_food'
});

// bot.dialog('Help', session => {
//     session.endDialog(`jmv`);
// }).triggerAction({
//     matches: 'Help'
// });

// // Spell Check
// if (process.env.IS_SPELL_CORRECTION_ENABLED === 'true') {
//     bot.use({
//         botbuilder: (session, next) => {
//             spellService
//                 .getCorrectedText(session.message.text)
//                 .then(text => {
//                     session.message.text = text;
//                     next();
//                 })
//                 .catch(error => {
//                     console.error(error);
//                     next();
//                 });
//         }
//     });
// }

// // Helpers
// const hotelAsAttachment = hotel => {
//     return new builder.HeroCard()
//         .title(hotel.name)
//         .subtitle('%d stars. %d reviews. From $%d per night.', hotel.rating, hotel.numberOfReviews, hotel.priceStarting)
//         .images([new builder.CardImage().url(hotel.image)])
//         .buttons([
//             new builder.CardAction()
//                 .title('More details')
//                 .type('openUrl')
//                 .value('https://www.bing.com/search?q=hotels+in+' + encodeURIComponent(hotel.location))
//         ]);
// }

// const reviewAsAttachment = review => {
//     return new builder.ThumbnailCard()
//         .title(review.title)
//         .text(review.text)
//         .images([new builder.CardImage().url(review.image)]);
// }
