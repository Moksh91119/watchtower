import fp from "fastify-plugin";
export default fp(async (app) => {
    app.decorate("authenticate", async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch {
            return reply.code(401).send({
                error: "Unauthorized",
            });
        }
    });
});
