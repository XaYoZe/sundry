
export let apiTest = async (data = {}, key) => {
    return request(createApiOpt('test', 'api', data));
}

