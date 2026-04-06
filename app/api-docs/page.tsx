import SwaggerDocumentation from "./swaggerui";
import fs from "fs";
import path from "path";

export default async function ApiDocsPage() {
  const filePath = path.join(process.cwd(), "public", "openapi.json");
  const fileContent = fs.readFileSync(filePath, "utf8");
  const spec = JSON.parse(fileContent);

  return (
    <main style={{ padding: "2rem" }}>
      <SwaggerDocumentation spec={spec} />
    </main>
  );
}