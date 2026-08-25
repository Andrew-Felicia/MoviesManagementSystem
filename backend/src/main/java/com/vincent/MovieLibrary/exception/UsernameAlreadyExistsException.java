package com.vincent.MovieLibrary.exception;

public class UsernameAlreadyExistsException extends RuntimeException {

    public UsernameAlreadyExistsException() {
        super("Username is already registered");
    }
}
