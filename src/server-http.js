import{
    createServer
}from "node:http";

const server =
    createServer(
        function(req,res){
            res.end(
                "Hola desde Node.js"
            )
        }
    );

const PORT = 3000;

server.listen(
    PORT,
    function(){
        console.log(
            `Servidor activo en http://localhost:${PORT}`
        )
    }
);