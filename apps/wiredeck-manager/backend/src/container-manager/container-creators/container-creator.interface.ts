import { ContainerCreateOptions } from 'dockerode';

/**
 * Common interface for all container spec creators.
 * Each creator transforms a service-specific DTO into a Docker ContainerCreateOptions.
 *
 * Implementing this interface keeps the creator pattern consistent and makes
 * adding new container types straightforward.
 */
export interface ContainerCreator<TDto> {
  create(dto: TDto): ContainerCreateOptions;
}
