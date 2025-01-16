const db = require('../db');
const request = require("supertest");
const app = require("../app");

let uniqueCompanyName;
let uniqueCompanyDescription;

const generateUniqueName = () => "company" + Math.random().toString(36).substring(2, 15);
const generateUniqueDescription = () => "desc" + Math.random().toString(36).substring(2, 15);



describe("GET /invoices/:id", () => {
    let uniqueCompanyName; 

    beforeEach(async function () {
        uniqueCompanyName = generateUniqueName();
        uniqueCompanyDescription = generateUniqueDescription();
        await db.query("BEGIN");
        await db.query("DELETE FROM companies WHERE code = $1", [uniqueCompanyName]);
        await db.query("COMMIT");

        await db.query("BEGIN");
        await db.query("DELETE FROM invoices WHERE id = 1");
        await db.query("COMMIT");

        await db.query("BEGIN");
        await db.query("INSERT INTO companies VALUES ($1, $2, 'Some description.')", [uniqueCompanyName,uniqueCompanyDescription]);
        await db.query("COMMIT");

        await db.query("BEGIN");
        await db.query("INSERT INTO invoices (id, comp_code, amt) VALUES (1, $1, 100)", [uniqueCompanyName]);
        await db.query("COMMIT");
    });
    it('should respond with a single invoice', async () => {
        const res = await request(app).get("/invoices/1");
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('invoice');
        expect(res.body.invoice).toHaveProperty('id', 1);
    }, 10000);
});


describe("POST /invoices", () => {
    let uniqueCompanyName;

    beforeEach(async function () {
        uniqueCompanyName = generateUniqueName();
        uniqueCompanyDescription = generateUniqueDescription();
        await db.query("BEGIN");
        await db.query("DELETE FROM companies WHERE code = $1", [uniqueCompanyName]);
        await db.query("COMMIT");

        await db.query("BEGIN");
        await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, 'Some description.')",
            [uniqueCompanyName, uniqueCompanyName]);
        await db.query("COMMIT");
    });

    it('should respond with an invoice object and status code 200', async () => {
        const requestBody = {
            "comp_code": uniqueCompanyName,
            "amt": 500
        };

        const res = await request(app).post("/invoices").send(requestBody);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('invoice');

        expect(res.body.invoice).toHaveProperty('comp_code', requestBody.comp_code);
        expect(res.body.invoice).toHaveProperty('amt', requestBody.amt);
        expect(res.body.invoice).toHaveProperty('paid', false);
        expect(res.body.invoice).toHaveProperty('add_date');
    });
});

afterEach(async function () {
    await db.query("BEGIN");
    await db.query("DELETE FROM invoices");
    await db.query("COMMIT");

    await db.query("BEGIN");
    await db.query("DELETE FROM companies WHERE code = $1", [uniqueCompanyName]);
    await db.query("COMMIT");
});


describe("GET /invoices", () => {
    let uniqueCompanyName;
    beforeEach(async function () {
        uniqueCompanyName = generateUniqueName();
        uniqueCompanyDescription = generateUniqueDescription();
        await db.query("BEGIN");
        await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, 'Some description.')", [uniqueCompanyName, uniqueCompanyName]);
        await db.query("INSERT INTO invoices (comp_code, amt) VALUES ($1, 100)", [uniqueCompanyName]);
        await db.query("COMMIT");
    });

    it("should return all invoices", async () => {
        const res = await request(app).get("/invoices");

        expect(res.statusCode).toBe(200);
        expect(res.body.invoices[0]).toHaveProperty('id');
        expect(res.body.invoices[0]).toHaveProperty('comp_code');
    }, 10000);

    afterEach(async function () {
        await db.query("BEGIN");
        await db.query("DELETE FROM invoices");
        await db.query("DELETE FROM companies WHERE code = $1", [uniqueCompanyName]);
        await db.query("COMMIT");
    });
});


describe("PUT /invoices/:id", () => {
    let testInvoice;

    beforeEach(async function ()  {
        uniqueCompanyName = generateUniqueName();
        uniqueCompanyDescription = generateUniqueDescription();
        await db.query("BEGIN");
        const testCompany = await db.query(
            `INSERT INTO companies (code, name, description) VALUES ($1, $2, 'Test company.')
            RETURNING code`,
            [uniqueCompanyName, uniqueCompanyName]
        );
        testInvoice = await db.query(
            `INSERT INTO invoices (comp_code, amt) VALUES ($1, 100)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [uniqueCompanyName]
        );

        testInvoice = testInvoice.rows[0];

        await db.query("COMMIT");
    });

    it("should update an existing invoice and return the updated invoice", async () => {
        const updatedAmt = 200;
        const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ amt: updatedAmt, paid: false });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('invoice');
        expect(res.body.invoice).toHaveProperty('id', testInvoice.id);
        expect(res.body.invoice).toHaveProperty('amt', updatedAmt);
    });

    afterEach(async () => {
        await db.query("BEGIN");
        await db.query("DELETE FROM invoices WHERE id = $1", [testInvoice.id]);
        await db.query("DELETE FROM companies WHERE code = $1", [uniqueCompanyName]);
        await db.query("COMMIT");
    });
});

afterAll(async () => {
    await db.end();
});