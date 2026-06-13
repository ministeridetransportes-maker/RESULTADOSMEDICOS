// api/send-email.js
// Función serverless de Vercel — recibe el PDF en base64 y lo envía con Resend

export default async function handler(req, res) {

    // Solo permitir POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    // CORS — permite que tu HTML (en cualquier dominio) llame a esta función
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    const { to_email, pdf_base64, nombre, dni, sede, resultado, fecha } = req.body;

    // Validaciones básicas
    if (!to_email || !pdf_base64) {
        return res.status(400).json({ error: "Faltan campos: to_email y pdf_base64 son requeridos." });
    }

    // Limpiar el prefijo "data:application/pdf;base64," si viene incluido
    const base64Clean = pdf_base64.replace(/^data:application\/pdf;base64,/, "");

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: "Certificados MTC <https://resultadosmedicos.vercel.app/", // ← Cambia por tu dominio verificado en Resend
                to: [to_email],
                subject: `Certificado Médico-Psicosomático — ${nombre || "Postulante"}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                        <h2 style="color: #1e293b; border-bottom: 2px solid #00b894; padding-bottom: 10px;">
                            📋 Certificado de Examen Médico-Psicosomático
                        </h2>
                        <p style="color: #555;">Se adjunta el certificado médico con los siguientes datos:</p>
                        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
                            <tr style="background:#f8f9fa;">
                                <td style="padding:8px 12px; font-weight:bold; border:1px solid #dee2e6;">Postulante</td>
                                <td style="padding:8px 12px; border:1px solid #dee2e6;">${nombre || "---"}</td>
                            </tr>
                            <tr>
                                <td style="padding:8px 12px; font-weight:bold; border:1px solid #dee2e6;">DNI</td>
                                <td style="padding:8px 12px; border:1px solid #dee2e6;">${dni || "---"}</td>
                            </tr>
                            <tr style="background:#f8f9fa;">
                                <td style="padding:8px 12px; font-weight:bold; border:1px solid #dee2e6;">Centro de Salud</td>
                                <td style="padding:8px 12px; border:1px solid #dee2e6;">${sede || "---"}</td>
                            </tr>
                            <tr>
                                <td style="padding:8px 12px; font-weight:bold; border:1px solid #dee2e6;">Resultado</td>
                                <td style="padding:8px 12px; border:1px solid #dee2e6; font-weight:bold; color:#00b894;">${resultado || "---"}</td>
                            </tr>
                            <tr style="background:#f8f9fa;">
                                <td style="padding:8px 12px; font-weight:bold; border:1px solid #dee2e6;">Fecha de emisión</td>
                                <td style="padding:8px 12px; border:1px solid #dee2e6;">${fecha || "---"}</td>
                            </tr>
                        </table>
                        <p style="color:#888; font-size:12px; margin-top:20px; border-top:1px solid #eee; padding-top:12px;">
                            Este certificado fue generado por el sistema MTC. El archivo PDF adjunto es el documento oficial.
                        </p>
                    </div>
                `,
                attachments: [
                    {
                        filename: `Certificado_${nombre || "medico"}.pdf`,
                        content: base64Clean  // Resend acepta base64 directamente
                    }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Error de Resend:", data);
            return res.status(response.status).json({ error: data.message || "Error al enviar con Resend" });
        }

        return res.status(200).json({ ok: true, id: data.id });

    } catch (err) {
        console.error("Error interno:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
}
