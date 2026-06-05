import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",

    datasource: {
        // url: "mysql://root:anUEjPWaxuUGAsppnbGcMwYmcIMCxCdm@mainline.proxy.rlwy.net:56635/railway",
        url: "mysql://root:@localhost:3306/farmio"
    },

});