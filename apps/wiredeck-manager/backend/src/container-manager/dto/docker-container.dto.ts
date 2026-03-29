import { ApiProperty } from '@nestjs/swagger';

export class DockerContainerPortDto {
  @ApiProperty({ example: 80 })
  privatePort?: number;

  @ApiProperty({ example: 8080, required: false })
  publicPort?: number;

  @ApiProperty({ example: 'tcp' })
  type?: string;
}

/** Slim container representation returned by the container-manager endpoints */
export class DockerContainerDto {
  @ApiProperty({ example: 'a1b2c3d4e5f6' })
  id: string;

  @ApiProperty({ example: 'my-container' })
  name: string;

  @ApiProperty({ example: 'nginx:latest' })
  image: string;

  @ApiProperty({
    example: 'running',
    description: 'created | restarting | running | removing | paused | exited | dead',
  })
  state: string;

  @ApiProperty({ example: 'Up 2 hours' })
  status: string;

  @ApiProperty({ type: [DockerContainerPortDto] })
  ports?: DockerContainerPortDto[];
}
