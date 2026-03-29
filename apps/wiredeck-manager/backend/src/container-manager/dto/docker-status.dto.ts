import { ApiProperty } from '@nestjs/swagger';

/** Response body for GET /api/docker/status */
export class DockerStatusDto {
  @ApiProperty({ example: true, description: 'Whether Docker daemon is reachable' })
  connected: boolean;

  @ApiProperty({ example: '28.1.1', description: 'Docker engine version' })
  version: string;

  @ApiProperty({ example: 'Ubuntu 20.04.6 LTS', description: 'Host operating system' })
  os: string;

  @ApiProperty({ example: 14, description: 'Total number of containers (all states)' })
  containers: number;

  @ApiProperty({ example: 7, description: 'Number of currently running containers' })
  containersRunning: number;

  @ApiProperty({ example: 48, description: 'Number of locally available images' })
  images: number;
}
