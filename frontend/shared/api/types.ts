export type TokenPair = {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_id: number;
}

export type ApiErorr = {
    detail: string | { msg: string; type: string }[]
}