# Welcome to your KaroVicious Reservations project

## How can I edit this code?

There are several ways of editing your application.

### Use your preferred IDE

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Edit a file directly in GitHub

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

### Use GitHub Codespaces

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?


### Deploy to production

Puedes desplegar este proyecto en cualquier plataforma moderna como Vercel, Netlify, Supabase o tu propio servidor.

Pasos generales:

1. Realiza un build de producción:
   ```sh
   npm run build
   ```
2. Sube la carpeta `dist` generada al proveedor de hosting de tu preferencia.
3. Configura las variables de entorno necesarias (si aplica).
4. Si usas Vercel/Netlify, solo conecta el repositorio y selecciona el comando de build `npm run build` y de preview `npm run preview`.

Para despliegues avanzados, consulta la documentación de tu proveedor de hosting.


## ¿Cómo conectar un dominio personalizado?

Todos los proveedores modernos permiten conectar dominios personalizados. Consulta la documentación de tu hosting para instrucciones específicas.
