//Load Swagger API documentation

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VERSION } from '../utils/env';

export function loadSwagger(app) {
  const config = new DocumentBuilder()
    .setTitle('Wiredeck Manager - backend API')
    .setDescription(
      '<h3>Wiredeck Manager - backend</h3></b> \
      <h4>For login, use these accounts:</h4> \
      <table><thead><tr><th>Username<br></th><th>Password</th><th>Role</th></tr></thead>\
      <tbody><tr><td>user<br></td><td>password</td><td>User</td></tr>\
      <tr><td>admin</td><td>admin</td><td>Admin</td></tr></tbody></table><br>\
      Response of "<b>/auth/login</b>" is a bearer access token, copy and use it to Authorize<br>You can check the user with "<b>/auth/profile</b>"'
    )
    .setVersion(VERSION)
    .addBearerAuth()
    .addTag('auth')
    .addTag('health')
    .addTag('config')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
  });
}
