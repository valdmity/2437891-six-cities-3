import { inject, injectable } from 'inversify';
import { BaseController } from '../../libs/rest/controller/base-controller.abstract.js';
import { Component } from '../../types/component.enum.js';
import { Logger } from '../../libs/logger/logger.interface.js';
import { HttpMethod } from '../../libs/rest/types/http-method.enum.js';
import { Request, Response } from 'express';
import { HttpError } from '../../libs/rest/errors/http-error.js';
import { StatusCodes } from 'http-status-codes';
import { fillDTO } from '../../helpers/common.js';
import { UserService } from '../user/user-service.interface.js';
import { OfferService } from './rent-offer-service.interface.js';
import { OfferRdo } from './rdo/offer.rdo.js';
import { CreateOfferRequest } from './requests/create-offer-request.type.js';
import { UpdateOfferRequest } from './requests/update-offer-request.type.js';
import { OfferShortRdo } from './rdo/offer-short.rdo.js';
import { City } from '../../types/rent-offer.js';

@injectable()
export class OfferController extends BaseController {
  constructor(
    @inject(Component.Logger) protected readonly logger: Logger,
    @inject(Component.UserService) protected readonly offerService: OfferService,
    @inject(Component.UserService) protected readonly userService: UserService,
  ) {
    super(logger);

    this.logger.info('Register routes for OfferController…');

    this.addRoute({ path: '/', method: HttpMethod.Post, handler: this.create });
    this.addRoute({ path: '/', method: HttpMethod.Put, handler: this.update });
    this.addRoute({ path: '/', method: HttpMethod.Delete, handler: this.delete });
    this.addRoute({ path: '/:id', method: HttpMethod.Get, handler: this.getById });
  }

  public async create(
    { body }: CreateOfferRequest,
    res: Response,
  ): Promise<void> {
    const offer = await this.offerService.findById(body.id);

    if (offer) {
      throw new HttpError(
        StatusCodes.CONFLICT,
        `Offer with id «${body.id}» exists.`,
        'OfferController'
      );
    }

    const result = await this.offerService.create(body);
    this.created(res, fillDTO(OfferRdo, result));
  }

  public async update(
    { body }: UpdateOfferRequest,
    res: Response,
  ): Promise<void> {
    const existsOffer = await this.offerService.findById(body.id);

    if (!existsOffer) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        `Offer with id «${body.id}» not exists.`,
        'OfferController'
      );
    }

    const result = await this.offerService.update(body);
    this.ok(res, fillDTO(OfferRdo, result));
  }

  public async delete(
    req: Request,
    res: Response,
  ): Promise<void> {
    const offer = await this.offerService.findById(req.params.id);

    if (!offer) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        `Offer with id «${req.params.id}» not exists.`,
        'OfferController'
      );
    }

    await this.offerService.delete(req.params.id);
    this.noContent(res, null);
  }

  public async getById(
    req: Request,
    res: Response,
  ): Promise<void> {
    const offer = await this.offerService.findById(req.params.id);

    if (!offer) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        `Offer with id «${req.params.id}» not exists.`,
        'OfferController'
      );
    }

    this.ok(res, fillDTO(OfferRdo, offer));
  }

  public async getAll(
    req: Request,
    res: Response,
  ): Promise<void> {
    const count = Number.isInteger(req.params.count)
      ? Number.parseInt(req.params.count, 10)
      : 60;
    const offers = await this.offerService.findAll(count);

    this.ok(res, offers.map((o) => fillDTO(OfferShortRdo, o)));
  }

  public async getPremium(
    req: Request,
    res: Response,
  ): Promise<void> {
    const offers = await this.offerService.findPremium(req.body.city as City);

    this.ok(res, offers.map((o) => fillDTO(OfferShortRdo, o)));
  }
}
