import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { getDataSourceToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const dataSource = app.get<DataSource>(getDataSourceToken());
  await dataSource.synchronize(true);

  const productRespo = dataSource.getRepository('Product');
  await productRespo.save([
    {
      id: '4db90733-63e9-445b-9966-d6a6ddb20ff7',
      name: 'iPhone 14',
      description: 'iPhone 14 Pro',
      image_url: 'https://images.unsplash.com/photo-1617813567799-d1e0e8e1f4f6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
      price: 10000,
    },
    {
      id: '4db90733-63e9-445b-9966-d6a6ddb20ff8',
      name: 'iPhone 14 Pro Max',
      description: 'iPhone 14 Pro Max',
      image_url: 'https://images.unsplash.com/photo-1617813567799-d1e0e8e1f4f6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
      price: 10000,
    },
  ])


  await app.close();
}

bootstrap();
