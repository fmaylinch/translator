package com.codethen.translator.storage;

public class FileStorageException extends RuntimeException {

    public FileStorageException(String message) {
        super(message);
    }

    public FileStorageException(String message, Throwable e) {
        super(message, e);
    }
}
