require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const port = 5050;

// Swagger options
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'Sinabro_API',
      version: '1.0.0',
      description: 'Sinabro_API_DESCRIPTION',
    },
  },
  apis: ['./routes/*.js'], // files containing annotations as above
};

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

app.use(express.json());

// 정적 파일 서비스를 위한 middleware 설정
app.use(express.static(path.join(__dirname, 'public')));

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// [places] collection에 대한 router 등록
const placeRouter = require('./routes/places');
app.use('/api/places', placeRouter);

// [people_numbers] collection에 대한 router 등록
const peopleNumberRouter = require('./routes/people_numbers');
app.use('/api/peopleNumbers', peopleNumberRouter);

// [markers] collection에 대한 router 등록
const markerRouter = require('./routes/markers');
app.use('/api/markers', markerRouter);

app.listen(port, () => {
  console.log('Server started on port 5050');
});
