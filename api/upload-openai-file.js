import { formidable } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      multiples: false,
      maxFileSize: 5 * 1024 * 1024, // 5MB max size
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Formidable parse error:', err);
          return reject(err);
        }
        resolve([fields, files]);
      });
    });

    const uploadedFileArray = files.file;

    if (!uploadedFileArray || uploadedFileArray.length === 0 || !uploadedFileArray[0]?.filepath) {
      console.error('❌ No valid file uploaded or filepath missing:', uploadedFileArray);
      return res.status(400).json({ error: 'No valid file uploaded' });
    }

    const uploadedFile = uploadedFileArray[0];
    const filePath = uploadedFile.filepath;
    const originalFilename = uploadedFile.originalFilename || uploadedFile.newFilename;

    // ✅ File type validation
    const allowedTypes = ['text/plain', 'text/csv', 'application/pdf'];
    if (!allowedTypes.includes(uploadedFile.mimetype)) {
      console.warn('❌ Unsupported file type:', uploadedFile.mimetype);
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), originalFilename);
    formData.append('purpose', 'user_data');

    try {
      const openaiRes = await axios.post('https://api.openai.com/v1/files', formData, {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      const result = openaiRes.data;
      res.status(200).json(result);

    } catch (axiosError) {
      if (axiosError.response) {
        console.error('Upload to OpenAI failed (Axios error):', axiosError.response.data);
        return res.status(axiosError.response.status).json(axiosError.response.data);
      } else if (axiosError.request) {
        console.error('No response received from OpenAI:', axiosError.request);
        return res.status(500).json({ error: 'No response from OpenAI API', details: axiosError.message });
      } else {
        console.error('Axios request setup error:', axiosError.message);
        return res.status(500).json({ error: 'Failed to send request to OpenAI', details: axiosError.message });
      }
    } finally {
      // ✅ Always clean up the temp file
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting temporary file:', err);
      });
    }

  } catch (err) {
    console.error('🔥 Upload handler failed (overall):', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
