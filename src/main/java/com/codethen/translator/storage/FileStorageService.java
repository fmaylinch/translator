package com.codethen.translator.storage;

import org.apache.commons.io.IOUtils;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Saves and loads files from temp folder
 */
@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService() {
        fileStorageLocation = Paths.get(System.getProperty("java.io.tmpdir"));
        System.out.println("Temp folder: " + fileStorageLocation);
    }

    public Resource loadFileAsResource(String fileName) {

        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if(resource.exists()) {
                return resource;
            } else {
                throw new FileStorageException("File not found " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new FileStorageException("File not found " + fileName, ex);
        }
    }

    public File storeInputStreamAsMp3File(InputStream inputStream) {

        try {
            final File file = File.createTempFile("tts-", ".mp3");
            IOUtils.copy(inputStream, new FileOutputStream(file));
            System.out.println("Created file: " + file.getAbsolutePath());
            return file;

        } catch (IOException e) {
            throw new FileStorageException("Can't create file", e);
        }
    }

    public File storeBytesAsFile(byte[] bytes) {

        return storeInputStreamAsMp3File(new ByteArrayInputStream(bytes));
    }
}
