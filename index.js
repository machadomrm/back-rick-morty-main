const express = require("express");
const mongodb = require("mongodb");
const ObjectId = mongodb.ObjectId;
require("dotenv").config();

(async () => {
	const dbUser = process.env.DB_USER;
	const dbPassword = process.env.DB_PASSWORD;
	const dbName = process.env.DB_NAME;
	const dbChar = process.env.DB_CHAR;

	const app = express();
	app.use(express.json());
	const port = process.env.PORT || 3000;
	const connectionString = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.${dbChar}.mongodb.net/${dbName}?retryWrites=true&w=majority`;

	const options = {
		useUnifiedTopology: true,
	};

	const client = await mongodb.MongoClient.connect(connectionString, options);

	const db = client.db("blue_db");
	const personagens = db.collection("personagens");

	const getPersonagensValidas = () => personagens.find({}).toArray();

	const getPersonagemById = async (id) =>
		personagens.findOne({ _id: ObjectId(id) });

	app.all("/*", (req, res, next) => {
		res.header("Access-Control-Allow-Origin", "*");

		res.header("Access-Control-Allow-Methods", "*");

		res.header(
			"Access-Control-Allow-Headers",
			"Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization"
		);

		next();
	});

	app.get("/", (req, res) => {
		res.send({ info: "Olá, Blue" });
	});

	//[GET] GetAllPersonagens

	app.get("/personagens", async (req, res) => {
		res.send(await getPersonagensValidas());
	});

	//[GET] getPersonagemById

	app.get("/personagens/:id", async (req, res) => {
		const id = req.params.id;
		const personagem = await getPersonagemById(id);
		if(!personagem){
			res.status(404).send({error:"O personagem especificado não foi encontrado."});
			return;
		}
		res.send(personagem);
	});

	//[POST] Adiciona personagem
	app.post("/personagens", async (req, res) => {
		const objeto = req.body;

		if (!objeto || !objeto.nome || !objeto.imagemUrl) {
			res.status(400).send(
				{error:"Personagem inválido, certifique-se que tenha os campos nome e imagemUrl"}
				);
			return;
		}

		const result = await personagens.insertOne(objeto);

		console.log(result);
		//Se ocorrer algum erro com o mongoDb esse if vai detectar
		if (result.acknowledged == false) {
			res.status (500).send("Ocorreu um erro");
			return;
		}

		res.status(201).send(objeto);
	});

	//[PUT] Atualiza personagem
	app.put("/personagens/:id", async (req, res) => {
		const id = req.params.id;
		const objeto = req.body;

		if (!objeto || !objeto.nome || !objeto.imagemUrl) {
		res.status(400).send(
			{error: "Requisição inválida, certifique-se que tenha os campos nome e imagemUrl"}
		);
		return;
	}

	const quantidadePersonagens = await personagens.countDocuments({
		_id: ObjectId(id),
	});

	if (quantidadePersonagens !== 1) {
		res.status(404).send({error: "Personagem não encontrado"});
		return;
	}
	
	const result = await personagens.updateOne(
		{
			_id: Object(id),
		},
		{
			$set: objeto,
		}
	);
	//console.Log(result);

			
	app.delete("/personagens/:id", async (req, res) => {
		const id = req.params.id;

		res.send(
			await personagens.deleteOne({
				_id: ObjectId(id),
			})
		);
	});

	app.listen(port, () => {
		console.info(`App rodando em http://localhost:${port}`);
	});
})();
