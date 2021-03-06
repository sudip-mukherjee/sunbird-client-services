import 'reflect-metadata';
import {Container} from 'inversify';
import {HttpClient} from './core/http-service/implementation/http-client-adapters/http-client';
import {HttpClientCordovaAdapter} from './core/http-service/implementation/http-client-adapters/http-client-cordova-adapter';
import {HttpClientBrowserAdapter} from './core/http-service/implementation/http-client-adapters/http-client-browser-adapter';
import {CsHttpService} from './core/http-service/interface';
import {HttpServiceImpl} from './core/http-service/implementation/http-service-impl';
import {GroupServiceImpl} from './services/group/implementation/group-service-impl';
import {CsGroupService} from './services/group/interface';
import {InjectionTokens} from './injection-tokens';

export interface CsGroupServiceConfig {
    apiPath: string;
}

export interface CsConfig {
    core: {
        httpAdapter?: 'HttpClientBrowserAdapter' | 'HttpClientCordovaAdapter';
        global: {
            channelId?: string;
            producerId?: string;
            deviceId?: string;
        },
        api: {
            host: string;
            authentication: {
                userToken?: string;
                managedUserToken?: string;
                bearerToken?: string;
            };
        };
    };
    services: {
        groupServiceConfig?: CsGroupServiceConfig
    };
}

export class CsModule {
    private static _instance?: CsModule;

    public static get instance(): CsModule {
        if (!CsModule._instance) {
            CsModule._instance = new CsModule();
        }

        return CsModule._instance;
    }

    private _container: Container;

    private _isInitialised = false;

    private _config: CsConfig;

    get isInitialised(): boolean {
        return this._isInitialised;
    }

    get httpService(): CsHttpService {
        return this._container.get<CsHttpService>(InjectionTokens.core.HTTP_SERVICE);
    }

    get groupService(): CsGroupService {
        return this._container.get<CsGroupService>(InjectionTokens.services.group.GROUP_SERVICE);
    }

    get config(): CsConfig {
        return this._config;
    }

    public async init(config: CsConfig) {
        this._config = config;

        this._container = new Container();

        this._container.bind<Container>(InjectionTokens.CONTAINER).toConstantValue(this._container);

        this.updateConfig(config);

        this._isInitialised = true;
    }

    updateConfig(config: CsConfig) {
        this._config = config;

        const mode: 'rebind' | 'bind' = this._isInitialised ? 'rebind' : 'bind';

        if (config.core.httpAdapter === 'HttpClientCordovaAdapter') {
            this._container[mode]<HttpClient>(InjectionTokens.core.HTTP_ADAPTER)
                .to(HttpClientCordovaAdapter).inSingletonScope();
        } else {
            this._container[mode]<HttpClient>(InjectionTokens.core.HTTP_ADAPTER)
                .to(HttpClientBrowserAdapter).inSingletonScope();
        }

        this._container[mode]<string>(InjectionTokens.core.api.HOST)
            .toConstantValue(config.core.api.host);
        this._container[mode]<string | undefined>(InjectionTokens.core.global.CHANNEL_ID)
            .toConstantValue(config.core.global.channelId);
        this._container[mode]<string | undefined>(InjectionTokens.core.global.PRODUCER_ID)
            .toConstantValue(config.core.global.producerId);
        this._container[mode]<string | undefined>(InjectionTokens.core.global.DEVICE_ID)
            .toConstantValue(config.core.global.deviceId);
        this._container[mode]<string | undefined>(InjectionTokens.core.api.authentication.BEARER_TOKEN)
            .toConstantValue(config.core.api.authentication.bearerToken);
        this._container[mode]<string | undefined>(InjectionTokens.core.api.authentication.USER_TOKEN)
            .toConstantValue(config.core.api.authentication.userToken);
        this._container[mode]<string | undefined>(InjectionTokens.core.api.authentication.MANAGED_USER_TOKEN)
            .toConstantValue(config.core.api.authentication.managedUserToken);

        // httpService
        this._container[mode]<CsHttpService>(InjectionTokens.core.HTTP_SERVICE)
            .to(HttpServiceImpl).inSingletonScope();

        // groupService
        this._container[mode]<CsGroupService>(InjectionTokens.services.group.GROUP_SERVICE)
            .to(GroupServiceImpl).inSingletonScope();
        if (config.services.groupServiceConfig) {
            this._container[mode]<string>(InjectionTokens.services.group.GROUP_SERVICE_API_PATH)
                .toConstantValue(config.services.groupServiceConfig.apiPath);
        }
    }
}
